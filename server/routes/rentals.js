import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, readUsers } from './auth.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENTALS_FILE = path.join(__dirname, '../data/rentals.json');

// Helper to read rentals from database
export const readRentals = () => {
  try {
    if (!fs.existsSync(RENTALS_FILE)) return [];
    const content = fs.readFileSync(RENTALS_FILE, 'utf-8');
    return content ? JSON.parse(content) : [];
  } catch (e) {
    return [];
  }
};

// Helper to write rentals to database
export const writeRentals = (rentals) => {
  fs.writeFileSync(RENTALS_FILE, JSON.stringify(rentals, null, 2), 'utf-8');
};

/**
 * 1. GET /api/rentals
 * Public: Returns ONLY real, database-saved, approved, available, non-deleted listings.
 * Zero listings in database = returns []
 */
router.get('/', (req, res) => {
  try {
    const allRentals = readRentals();
    const users = readUsers();

    const { type, minPrice, maxPrice, state, city } = req.query;

    let filtered = allRentals.filter(item => {
      // Must be approved, available, not deleted
      if (item.status !== 'approved') return false;
      if (!item.available) return false;
      if (item.isDeleted) return false;

      // Optional filters
      if (type && type !== 'All' && item.equipmentType !== type) return false;
      if (minPrice && item.rentalPrice < Number(minPrice)) return false;
      if (maxPrice && item.rentalPrice > Number(maxPrice)) return false;
      if (state && item.state && item.state.toLowerCase() !== state.toLowerCase()) return false;
      if (city && item.city && item.city.toLowerCase() !== city.toLowerCase()) return false;

      return true;
    });

    // Populate owner public details safely (never expose private tokens or passwords)
    const sanitized = filtered.map(item => {
      const owner = users.find(u => u.id === item.ownerId);
      return {
        ...item,
        ownerName: owner ? owner.name : item.ownerName || 'Verified Farmer',
        isOwnerVerified: owner ? Boolean(owner.isVerified) : false,
        ownerPhone: item.showPhoneToPublic ? (owner ? owner.phone : item.contactPhone) : null
      };
    });

    return res.json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (err) {
    console.error('Error fetching rentals:', err);
    return res.status(500).json({ error: 'Failed to retrieve rental equipment from database.' });
  }
});

/**
 * 2. GET /api/rentals/my
 * Protected: Returns equipment listings belonging to the authenticated user
 */
router.get('/my', requireAuth, (req, res) => {
  try {
    const allRentals = readRentals();
    const myListings = allRentals.filter(r => r.ownerId === req.user.id && !r.isDeleted);
    return res.json({
      success: true,
      count: myListings.length,
      data: myListings
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve your listings.' });
  }
});

/**
 * 3. GET /api/rentals/:id
 * Public: Returns details of a specific verified listing
 */
router.get('/:id', (req, res) => {
  const allRentals = readRentals();
  const item = allRentals.find(r => r.id === req.params.id && !r.isDeleted && r.status === 'approved');

  if (!item) {
    return res.status(404).json({ error: 'Rental listing not found or no longer available.' });
  }

  const users = readUsers();
  const owner = users.find(u => u.id === item.ownerId);

  return res.json({
    success: true,
    data: {
      ...item,
      ownerName: owner ? owner.name : item.ownerName,
      isOwnerVerified: owner ? Boolean(owner.isVerified) : false,
      ownerPhone: item.showPhoneToPublic ? (owner ? owner.phone : item.contactPhone) : null
    }
  });
});

/**
 * 4. POST /api/rentals
 * Protected: Signed-in user creates a new equipment rental listing
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      name,
      category,
      equipmentType,
      brand,
      model,
      horsepower,
      engineCapacity,
      fuelType,
      condition,
      photoUrl,
      rentalPrice,
      billingUnit,
      availableFrom,
      availableTo,
      pickupLocation,
      serviceArea,
      rentalTerms,
      contactPhone,
      showPhoneToPublic
    } = req.body;

    // Strict Server-Side Validation
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Equipment name is required (min 3 characters).' });
    }

    const validTypes = ['Tractor', 'Harvester', 'Rotavator', 'Cultivator', 'Seed Drill', 'Thresher', 'Power Sprayer', 'Drone Sprayer', 'Water Pump', 'Laser Leveller', 'Baler', 'Other Machinery'];
    if (!equipmentType || !validTypes.includes(equipmentType)) {
      return res.status(400).json({ error: `Valid equipment type required. Supported: ${validTypes.join(', ')}` });
    }

    const priceNum = Number(rentalPrice);
    if (!priceNum || priceNum <= 0) {
      return res.status(400).json({ error: 'Please enter a valid positive rental rate.' });
    }

    const validUnits = ['per hour', 'per day', 'per acre', 'per week'];
    if (!billingUnit || !validUnits.includes(billingUnit)) {
      return res.status(400).json({ error: `Valid billing unit required. Supported: ${validUnits.join(', ')}` });
    }

    // Horsepower validation - only applicable for tractors and motorized machinery
    const isMotorized = ['Tractor', 'Harvester', 'Power Sprayer', 'Water Pump'].includes(equipmentType);
    let hpClean = null;
    if (isMotorized && horsepower) {
      hpClean = String(horsepower).trim();
    }

    const newListing = {
      id: `rent_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      ownerId: req.user.id, // Strictly derived from authenticated server session
      ownerName: req.user.name,
      ownerPhone: req.user.phone,
      contactPhone: contactPhone ? String(contactPhone).trim() : req.user.phone,
      showPhoneToPublic: showPhoneToPublic !== false,
      name: name.trim(),
      category: category || 'Farming Machinery',
      equipmentType,
      brand: brand ? brand.trim() : null,
      model: model ? model.trim() : null,
      horsepower: hpClean,
      engineCapacity: engineCapacity ? engineCapacity.trim() : null,
      fuelType: fuelType ? fuelType.trim() : null,
      condition: condition ? condition.trim() : 'Good Operating Condition',
      photoUrl: photoUrl && photoUrl.trim() ? photoUrl.trim() : null,
      rentalPrice: priceNum,
      billingUnit,
      availableFrom: availableFrom || null,
      availableTo: availableTo || null,
      pickupLocation: pickupLocation ? pickupLocation.trim() : req.user.city || 'Local Village',
      serviceArea: serviceArea ? serviceArea.trim() : (req.user.city ? `${req.user.city} and nearby villages` : null),
      rentalTerms: rentalTerms ? rentalTerms.trim() : 'Standard agricultural rental agreement. Fuel and operator terms by mutual agreement.',
      state: req.user.state || 'Karnataka',
      city: req.user.city || 'Kalaburagi',
      status: 'approved', // Live approved listing
      available: true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const allRentals = readRentals();
    allRentals.unshift(newListing);
    writeRentals(allRentals);

    return res.status(201).json({
      success: true,
      message: 'Equipment listing created successfully!',
      data: newListing
    });
  } catch (err) {
    console.error('Error creating rental:', err);
    return res.status(500).json({ error: 'Server error while creating equipment listing.' });
  }
});

/**
 * 5. PUT /api/rentals/:id
 * Protected: Update own listing with strict ownership check
 */
router.put('/:id', requireAuth, (req, res) => {
  const allRentals = readRentals();
  const index = allRentals.findIndex(r => r.id === req.params.id && !r.isDeleted);

  if (index === -1) {
    return res.status(404).json({ error: 'Rental listing not found.' });
  }

  // ENFORCE SERVER-SIDE AUTHORIZATION: Only owner can edit
  if (allRentals[index].ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized. You can only edit your own equipment listings.' });
  }

  const updates = req.body;
  const allowed = [
    'name', 'brand', 'model', 'horsepower', 'engineCapacity', 'condition',
    'photoUrl', 'rentalPrice', 'billingUnit', 'available', 'availableFrom',
    'availableTo', 'pickupLocation', 'serviceArea', 'rentalTerms', 'showPhoneToPublic'
  ];

  allowed.forEach(field => {
    if (updates[field] !== undefined) {
      allRentals[index][field] = updates[field];
    }
  });

  allRentals[index].updatedAt = new Date().toISOString();
  writeRentals(allRentals);

  return res.json({
    success: true,
    message: 'Listing updated successfully.',
    data: allRentals[index]
  });
});

/**
 * 6. DELETE /api/rentals/:id
 * Protected: Delete own listing with strict ownership check
 */
router.delete('/:id', requireAuth, (req, res) => {
  const allRentals = readRentals();
  const index = allRentals.findIndex(r => r.id === req.params.id && !r.isDeleted);

  if (index === -1) {
    return res.status(404).json({ error: 'Rental listing not found.' });
  }

  // ENFORCE SERVER-SIDE AUTHORIZATION: Only owner can delete
  if (allRentals[index].ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized. You can only delete your own equipment listings.' });
  }

  // Soft delete
  allRentals[index].isDeleted = true;
  allRentals[index].available = false;
  allRentals[index].updatedAt = new Date().toISOString();
  writeRentals(allRentals);

  return res.json({
    success: true,
    message: 'Equipment listing removed successfully.'
  });
});

export default router;
