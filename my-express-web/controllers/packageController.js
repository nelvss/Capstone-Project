const supabase = require('../config/supabase');

const getPackagePricing = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('package_pricing')
      .select('*')
      .order('min_tourist');
    
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch package pricing', error: error.message });
    }
    
    res.json({ success: true, pricing: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const getTourPricing = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tour_pricing')
      .select('*')
      .order('min_tourist');
    
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch tour pricing', error: error.message });
    }
    
    res.json({ success: true, pricing: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const getPackages = async (req, res) => {
  try {
    const { hotel_id, include = 'pricing' } = req.query;

    let query = supabase
      .from('package_only')
      .select('*');

    if (hotel_id) {
      query = query.eq('hotel_id', hotel_id);
    }

    const { data: packages, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch packages', error: error.message });
    }

    if (include === 'pricing') {
      const ids = (packages || []).map(p => p.package_only_id);
      if (ids.length > 0) {
        const { data: tiers } = await supabase
          .from('package_pricing')
          .select('*')
          .in('package_only_id', ids)
          .order('min_tourist');
        if (tiers) {
          const grouped = new Map();
          tiers.forEach(t => {
            const key = t.package_only_id;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(t);
          });
          (packages || []).forEach(p => {
            p.pricing = grouped.get(p.package_only_id) || [];
          });
        }
      }
    }

    res.json({ success: true, packages: packages || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const createPackage = async (req, res) => {
  try {
    const { description, category, hotel_id, pricing = [] } = req.body;
    if (!description || !category || !hotel_id) {
      return res.status(400).json({ success: false, message: 'description, category, hotel_id are required' });
    }

    const { data: inserted, error } = await supabase
      .from('package_only')
      .insert([{ description, category, hotel_id }])
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to create package', error: error.message });
    }

    let createdPricing = [];
    if (Array.isArray(pricing) && pricing.length > 0) {
      const rows = pricing.map(t => ({
        package_only_id: inserted.package_only_id,
        hotel_id,
        min_tourist: Number(t.min_tourist),
        max_tourist: Number(t.max_tourist),
        price_per_head: Number(t.price_per_head)
      }));
      const { data: tiers } = await supabase
        .from('package_pricing')
        .insert(rows)
        .select('*');
      if (tiers) {
        createdPricing = tiers;
      }
    }

    res.json({ success: true, package: { ...inserted, pricing: createdPricing } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: pkg, error } = await supabase
      .from('package_only')
      .select('*')
      .eq('package_only_id', id)
      .single();
    if (error) {
      return res.status(404).json({ success: false, message: 'Package not found', error: error.message });
    }
    const { data: pricing } = await supabase
      .from('package_pricing')
      .select('*')
      .eq('package_only_id', id)
      .order('min_tourist');
    res.json({ success: true, package: { ...pkg, pricing: pricing || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, category, hotel_id, pricing = [] } = req.body;

    const updates = {};
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (hotel_id !== undefined) updates.hotel_id = hotel_id;
    if (Object.keys(updates).length === 0 && !Array.isArray(pricing)) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    let updated;
    if (Object.keys(updates).length) {
      const { data, error } = await supabase
        .from('package_only')
        .update(updates)
        .eq('package_only_id', id)
        .select('*')
        .single();
      if (error) {
        return res.status(500).json({ success: false, message: 'Failed to update package', error: error.message });
      }
      updated = data;
    } else {
      const { data } = await supabase
        .from('package_only')
        .select('*')
        .eq('package_only_id', id)
        .single();
      updated = data;
    }

    if (Array.isArray(pricing)) {
      await supabase.from('package_pricing').delete().eq('package_only_id', id);
      if (pricing.length > 0) {
        const rows = pricing.map(t => ({
          package_only_id: id,
          hotel_id: (hotel_id || updated.hotel_id),
          min_tourist: Number(t.min_tourist),
          max_tourist: Number(t.max_tourist),
          price_per_head: Number(t.price_per_head)
        }));
        await supabase.from('package_pricing').insert(rows);
      }
    }

    const { data: newPricing } = await supabase
      .from('package_pricing')
      .select('*')
      .eq('package_only_id', id)
      .order('min_tourist');

    res.json({ success: true, package: { ...updated, pricing: newPricing || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('package_pricing').delete().eq('package_only_id', id);
    const { error } = await supabase
      .from('package_only')
      .delete()
      .eq('package_only_id', id);
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete package', error: error.message });
    }
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

module.exports = {
  getPackagePricing,
  getTourPricing,
  getPackages,
  createPackage,
  getPackageById,
  updatePackage,
  deletePackage
};

