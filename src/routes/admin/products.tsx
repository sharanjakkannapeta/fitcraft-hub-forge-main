import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Package, Plus, Search, Edit2, Trash2, Image as ImageIcon, 
  Upload, AlertTriangle, EyeOff, Eye, Download, X
} from "lucide-react";

export const Route = createFileRoute("/admin/products")({
  component: ProductsManagement,
});

function ProductsManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Edit/Add modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load products: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...editingProduct };
      delete payload.id;
      delete payload.created_at;

      if (editingProduct.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success("Product added");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error("Error saving product: " + error.message);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success("Product deleted");
      fetchProducts();
    } catch (error: any) {
      toast.error("Error deleting product: " + error.message);
    }
  };
  
  const toggleProductActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error: any) {
      toast.error("Error toggling product status: " + error.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist yet, we will just simulate success for UI demo
        if (uploadError.message.includes("Bucket not found")) {
          toast.info("Bucket not found, using a dummy image URL for demo");
          setEditingProduct({
            ...editingProduct,
            images: [...(editingProduct.images || []), 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80']
          });
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      
      setEditingProduct({
        ...editingProduct,
        images: [...(editingProduct.images || []), publicUrl]
      });
      
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...(editingProduct.images || [])];
    newImages.splice(index, 1);
    setEditingProduct({ ...editingProduct, images: newImages });
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Products Management</h1>
        <div className="flex items-center gap-3">
          <button 
            className="flex items-center gap-2 rounded-md bg-white border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors dark:bg-card"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button 
            onClick={() => { 
              setEditingProduct({ 
                supplier_type: 'india', 
                stock: 0, 
                low_stock_threshold: 10, 
                is_active: true,
                images: []
              }); 
              setIsModalOpen(true); 
            }}
            className="flex items-center gap-2 rounded-md bg-foreground text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {/* Filters Area */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search products by name or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-muted/30 transition-colors ${!product.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt={product.name} className="h-12 w-12 rounded-lg object-cover border border-border" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{product.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ${product.sale_price || product.price}
                      {product.sale_price && product.sale_price < product.price && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">${product.price}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{product.stock}</span>
                        {product.stock < (product.low_stock_threshold || 10) && (
                          <AlertTriangle className="h-4 w-4 text-red-500" title="Low Stock" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider
                        ${product.supplier_type === 'zendrop' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}
                      `}>
                        {product.supplier_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => toggleProductActive(product.id, product.is_active)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title={product.is_active ? "Deactivate" : "Activate"}
                      >
                        {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-xl bg-card border border-border shadow-xl my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className="font-display text-2xl font-bold">{editingProduct.id ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={saveProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Product Name</label>
                    <input
                      required
                      type="text"
                      value={editingProduct.name || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                    <input
                      required
                      type="text"
                      value={editingProduct.category || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Regular Price</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={editingProduct.price || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Sale Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.sale_price || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: parseFloat(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Stock Quantity</label>
                      <input
                        required
                        type="number"
                        value={editingProduct.stock || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Low Stock Alert</label>
                      <input
                        type="number"
                        value={editingProduct.low_stock_threshold || 10}
                        onChange={(e) => setEditingProduct({ ...editingProduct, low_stock_threshold: parseInt(e.target.value) })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={editingProduct.description || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    />
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <label className="block text-sm font-medium text-muted-foreground mb-3">Supplier Settings</label>
                    <div className="space-y-3">
                      <div>
                        <select
                          value={editingProduct.supplier_type || "india"}
                          onChange={(e) => setEditingProduct({ ...editingProduct, supplier_type: e.target.value })}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          <option value="india">India Local Supplier</option>
                          <option value="zendrop">Zendrop Fulfillment</option>
                        </select>
                      </div>
                      
                      {editingProduct.supplier_type === 'zendrop' && (
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Zendrop Product ID"
                            value={editingProduct.zendrop_product_id || ""}
                            onChange={(e) => setEditingProduct({ ...editingProduct, zendrop_product_id: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <input
                            type="text"
                            placeholder="Zendrop Variant ID"
                            value={editingProduct.zendrop_variant_id || ""}
                            onChange={(e) => setEditingProduct({ ...editingProduct, zendrop_variant_id: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingProduct.is_active !== false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">Product is active and visible to customers</label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Product Images</label>
                <div className="flex flex-wrap gap-4">
                  {editingProduct.images && editingProduct.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative h-24 w-24 rounded-md border border-border overflow-hidden group">
                      <img src={img} alt={`Product ${idx}`} className="h-full w-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 hover:bg-muted transition-colors">
                    {uploadingImage ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      ref={fileInputRef}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-foreground px-6 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {editingProduct.id ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
