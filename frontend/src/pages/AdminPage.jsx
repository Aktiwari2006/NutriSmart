import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { Plus, Pencil, Trash2, X, Check, Package, ShoppingBag, Users, DollarSign } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const EMPTY_FORM = {
  name: "", description: "", image_url: "", price: "", calories: "",
  protein: "", carbs: "", fat: "", category: "balanced", tags: "", is_available: true,
};

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("menu");
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/menu`, { withCredentials: true }),
        axios.get(`${API}/admin/orders`, { withCredentials: true }),
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
      ]);
      setMenuItems(menuRes.data);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFormChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        calories: parseInt(form.calories),
        protein: parseFloat(form.protein),
        carbs: parseFloat(form.carbs),
        fat: parseFloat(form.fat),
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      if (editItem) {
        await axios.put(`${API}/admin/menu/${editItem.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API}/admin/menu`, payload, { withCredentials: true });
      }
      setShowForm(false);
      setEditItem(null);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, tags: item.tags?.join(", ") || "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await axios.delete(`${API}/admin/menu/${id}`, { withCredentials: true });
    fetchData();
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Admin Panel</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users size={18} className="text-blue-500" />, label: "Users", value: stats.total_users || 0 },
            { icon: <ShoppingBag size={18} className="text-green-500" />, label: "Orders", value: stats.total_orders || 0 },
            { icon: <Package size={18} className="text-[#FF6B35]" />, label: "Menu Items", value: stats.total_menu_items || 0 },
            { icon: <DollarSign size={18} className="text-purple-500" />, label: "Revenue", value: `₹${stats.total_revenue || 0}` },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100" data-testid={`stat-${s.label.toLowerCase()}`}>
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-gray-500 font-medium">{s.label}</span></div>
              <div className="text-3xl font-black text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["menu", "orders"].map(t => (
            <button
              key={t}
              data-testid={`admin-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold capitalize transition-all ${tab === t ? "bg-[#FF6B35] text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {t === "menu" ? "Menu Management" : "Orders"}
            </button>
          ))}
        </div>

        {/* Menu Tab */}
        {tab === "menu" && (
          <div data-testid="admin-menu-tab">
            <div className="flex justify-end mb-4">
              <button
                data-testid="add-menu-item-btn"
                onClick={() => { setForm(EMPTY_FORM); setEditItem(null); setShowForm(true); }}
                className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>

            {/* Form Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{editItem ? "Edit Item" : "Add New Item"}</h2>
                    <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
                  </div>
                  <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
                    {[
                      { key: "name", label: "Name", full: true },
                      { key: "description", label: "Description", full: true },
                      { key: "image_url", label: "Image URL", full: true },
                      { key: "price", label: "Price (₹)", type: "number" },
                      { key: "calories", label: "Calories", type: "number" },
                      { key: "protein", label: "Protein (g)", type: "number" },
                      { key: "carbs", label: "Carbs (g)", type: "number" },
                      { key: "fat", label: "Fat (g)", type: "number" },
                      { key: "tags", label: "Tags (comma separated)", full: true },
                    ].map(f => (
                      <div key={f.key} className={f.full ? "col-span-2" : ""}>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">{f.label}</label>
                        <input
                          data-testid={`form-${f.key}`}
                          type={f.type || "text"}
                          value={form[f.key]}
                          onChange={e => handleFormChange(f.key, e.target.value)}
                          required
                          step={f.type === "number" ? "0.1" : undefined}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                      <select
                        data-testid="form-category"
                        value={form.category}
                        onChange={e => handleFormChange("category", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                      >
                        <option value="low_calorie">Low Calorie (Healthy)</option>
                        <option value="balanced">Balanced</option>
                        <option value="high_calorie">High Calorie (Indulgent)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <input type="checkbox" id="available" checked={form.is_available} onChange={e => handleFormChange("is_available", e.target.checked)} className="w-4 h-4 accent-[#FF6B35]" />
                      <label htmlFor="available" className="text-sm font-medium text-gray-700">Available</label>
                    </div>
                    {error && <div className="col-span-2 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-xl">{error}</div>}
                    <div className="col-span-2 flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-2xl">Cancel</button>
                      <button data-testid="save-item-btn" type="submit" disabled={saving} className="flex-1 bg-[#FF6B35] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Check size={16} /> {editItem ? "Update" : "Add"}</>}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Menu Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="menu-table">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Item", "Category", "Price", "Calories", "Available", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {menuItems.map(item => (
                        <tr key={item.id} data-testid={`menu-row-${item.id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover"
                                onError={e => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&auto=format"; }} />
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-400 truncate max-w-xs">{item.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.category === "low_calorie" ? "bg-green-100 text-green-700" : item.category === "balanced" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {item.category.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">₹{item.price}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.calories} kcal</td>
                          <td className="px-4 py-3">
                            <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.is_available ? "bg-green-400" : "bg-red-400"}`}></span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button data-testid={`edit-${item.id}`} onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Pencil size={14} />
                              </button>
                              <button data-testid={`delete-${item.id}`} onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" data-testid="admin-orders-tab">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Order ID", "User", "Items", "Total", "Status", "Payment", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <tr key={order.id} data-testid={`admin-order-${order.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{order.id?.slice(-8)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{order.user_id?.slice(-8)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.items?.length} item(s)</td>
                      <td className="px-4 py-3 text-sm font-medium">₹{order.total_amount}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{order.payment_status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
