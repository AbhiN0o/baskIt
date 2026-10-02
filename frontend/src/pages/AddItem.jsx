import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tag, DollarSign, Layers, FileText, Package, Camera, ImageIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SellerAddItemPage() {
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    images: [],
  });

  useEffect(() => { setMounted(true); }, []);

  const handleInput = (field, value) => setProduct(prev => ({ ...prev, [field]: value }));
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(f => URL.createObjectURL(f));
    setProduct(prev => ({ ...prev, images: [...prev.images, ...urls] }));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <span className="text-stone-600 text-xs tracking-widest uppercase animate-pulse">Loading...</span>
      </div>
    );
  }

  const fields = [
    { key: 'name', label: 'Product Name', icon: <Tag size={14} />, type: 'text', placeholder: 'e.g. Handwoven Silk Scarf' },
    { key: 'price', label: 'Price (₹)', icon: <DollarSign size={14} />, type: 'number', placeholder: 'e.g. 1200' },
    { key: 'stock', label: 'Stock Quantity', icon: <Package size={14} />, type: 'number', placeholder: 'e.g. 25' },
  ];

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <div className="border-b border-stone-800 px-6 py-4 flex items-center gap-4 bg-stone-950">
        <Link to="/sellermarket" className="p-2 text-stone-500 hover:text-stone-200 transition-colors border border-stone-800 hover:border-stone-600">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-400 rounded-sm" />
          <span className="text-stone-100 font-black tracking-widest text-sm uppercase">BaskIt</span>
        </div>
        <span className="text-stone-700">›</span>
        <span className="text-stone-400 text-sm">New Listing</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="mb-10 border-b border-stone-800 pb-8">
          <span className="text-amber-400 text-xs tracking-[0.3em] uppercase font-medium block mb-2">Seller Studio</span>
          <h1 className="text-4xl font-black text-stone-100">List a New Creation</h1>
          <p className="text-stone-600 mt-2 text-sm">Add your handcrafted product to the marketplace</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <form className="space-y-0 border border-stone-800">
              {/* Name */}
              <div className="border-b border-stone-800">
                <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                  <Tag size={11} /> Product Name
                </label>
                <input
                  value={product.name}
                  onChange={(e) => handleInput('name', e.target.value)}
                  type="text"
                  placeholder="e.g. Handwoven Silk Scarf"
                  className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-lg font-semibold"
                />
              </div>

              {/* Category */}
              <div className="border-b border-stone-800">
                <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                  <Layers size={11} /> Category
                </label>
                <select
                  value={product.category}
                  onChange={(e) => handleInput('category', e.target.value)}
                  className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none text-base appearance-none cursor-pointer"
                  style={{ WebkitAppearance: 'none' }}
                >
                  <option value="" className="bg-stone-900 text-stone-400">Select a category</option>
                  <option value="jewelry" className="bg-stone-900">Jewelry</option>
                  <option value="pottery" className="bg-stone-900">Pottery</option>
                  <option value="textiles" className="bg-stone-900">Textiles</option>
                  <option value="woodwork" className="bg-stone-900">Woodwork</option>
                  <option value="art" className="bg-stone-900">Art & Paintings</option>
                  <option value="home" className="bg-stone-900">Home Decor</option>
                </select>
              </div>

              {/* Price & Stock side by side */}
              <div className="grid grid-cols-2 border-b border-stone-800">
                <div className="border-r border-stone-800">
                  <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                    <DollarSign size={11} /> Price (₹)
                  </label>
                  <input
                    value={product.price}
                    onChange={(e) => handleInput('price', e.target.value)}
                    type="number"
                    placeholder="0"
                    className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                    <Package size={11} /> Stock
                  </label>
                  <input
                    value={product.stock}
                    onChange={(e) => handleInput('stock', e.target.value)}
                    type="number"
                    placeholder="0"
                    className="w-full bg-transparent px-5 pb-4 pt-1 text-stone-100 focus:outline-none placeholder-stone-700 text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="border-b border-stone-800">
                <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest px-5 pt-4 pb-1">
                  <FileText size={11} /> Description
                </label>
                <textarea
                  value={product.description}
                  onChange={(e) => handleInput('description', e.target.value)}
                  rows="5"
                  placeholder="Tell buyers the story behind this piece..."
                  className="w-full bg-transparent px-5 pb-5 pt-1 text-stone-200 focus:outline-none placeholder-stone-700 text-sm leading-relaxed resize-none"
                />
              </div>

              {/* Image Upload */}
              <div className="border-b border-stone-800">
                <label className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-widest px-5 pt-4 pb-3">
                  <ImageIcon size={11} /> Images
                </label>
                <div className="mx-5 mb-5">
                  <label className="block border-2 border-dashed border-stone-700 hover:border-amber-400 transition-colors p-8 text-center cursor-pointer">
                    <Camera className="mx-auto text-stone-600 mb-2" size={24} />
                    <p className="text-stone-500 text-sm mb-1">Drag & Drop or Click to Upload</p>
                    <p className="text-stone-700 text-xs">PNG, JPG, WEBP accepted</p>
                    <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                  </label>

                  {product.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {product.images.map((img, i) => (
                        <div key={i} className="aspect-square border border-stone-700 overflow-hidden">
                          <img src={img} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                className="w-full py-5 font-black text-stone-950 text-sm tracking-widest uppercase bg-amber-400 hover:bg-amber-300 transition-all"
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.998 }}
              >
                Publish Item →
              </motion.button>
            </form>
          </motion.div>

          {/* Live Preview */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="sticky top-24">
              <div className="mb-4">
                <span className="text-stone-600 text-xs uppercase tracking-widest">Live Preview</span>
              </div>

              <div className="border border-stone-800 bg-stone-900/30">
                {/* Preview Image */}
                <div className="border-b border-stone-800 overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  {product.images[0] ? (
                    <img src={product.images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900">
                      <ImageIcon size={32} className="text-stone-700 mb-2" />
                      <span className="text-stone-700 text-xs">No image yet</span>
                    </div>
                  )}
                </div>

                {/* Preview Body */}
                <div className="p-6 space-y-4">
                  {product.category && (
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-400/30 px-2 py-0.5">
                      {product.category}
                    </span>
                  )}

                  <h3 className="text-stone-100 font-black text-xl leading-tight">
                    {product.name || <span className="text-stone-700">Product Name</span>}
                  </h3>

                  <p className="text-stone-500 text-sm leading-relaxed">
                    {product.description || <span className="text-stone-700">Product description will appear here...</span>}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                    <span className="text-stone-100 font-black text-2xl">
                      {product.price ? `₹${product.price}` : <span className="text-stone-700">₹—</span>}
                    </span>
                    <span className="text-stone-500 text-xs">
                      {product.stock ? `${product.stock} in stock` : <span className="text-stone-700">— in stock</span>}
                    </span>
                  </div>

                  <div className="pt-2">
                    <div className="w-full py-3 bg-stone-800 text-stone-500 text-xs font-bold uppercase tracking-widest text-center">
                      Add to Cart (Preview)
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="mt-4 border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">✦ Tips for better listings</div>
                <ul className="text-stone-500 text-xs space-y-1">
                  <li>• Use 4+ high-quality images from different angles</li>
                  <li>• Write a detailed, authentic story in the description</li>
                  <li>• Price competitively — check similar items first</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
