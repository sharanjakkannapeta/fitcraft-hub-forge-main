declare global {
  interface Window {
    Razorpay: any;
  }
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════
// 🔧 REPLACE WITH YOUR ACTUAL VALUES
// ══════════════════════════════════════════
const SUPABASE_URL = "pakkywdnawqrtdvoxbyo;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBha2t5d2RuYXdxcnRkdm94YnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzAyNTAsImV4cCI6MjA5MzgwNjI1MH0.pisqNgGYJGBHk-IeKn46lPvVI0cCjPnzSO0vLIW_Pzg";
// ══════════════════════════════════════════

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
  });
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // LOAD CART
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
  }, []);

  // REMOVE ITEM
  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    toast.success("Item removed");
  };

  // TOTAL
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // HANDLE FORM INPUT
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  // VALIDATE FORM
  const validate = (): boolean => {
    if (!form.name.trim()) {
      setFormError("Please enter your full name.");
      return false;
    }
    if (form.phone.trim().length !== 10 || isNaN(Number(form.phone))) {
      setFormError("Please enter a valid 10-digit phone number.");
      return false;
    }
    if (!form.address.trim()) {
      setFormError("Please enter your delivery address.");
      return false;
    }
    if (form.pincode.trim().length !== 6 || isNaN(Number(form.pincode))) {
      setFormError("Please enter a valid 6-digit pincode.");
      return false;
    }
    return true;
  };

  // SAVE ORDER TO SUPABASE
  const saveOrderToSupabase = async (
    paymentId: string,
    paymentMethod: "razorpay" | "cod"
  ) => {
    const productNames = cartItems.map((i) => `${i.name} x${i.quantity}`).join(", ");

    const { error } = await sb.from("orders").insert([{
      customer_name: form.name,
      phone: form.phone,
      address: form.address,
      pincode: form.pincode,
      product_name: productNames,
      amount: total,
      status: "pending",
      payment_id: paymentId,
      payment_method: paymentMethod,
      tracking_number: "",
    }]);

    if (error) {
      console.error("Supabase error:", error);
      // Don't block user — order still went through
    }
  };

  // CLEAR CART AFTER ORDER
  const clearCart = () => {
    localStorage.removeItem("cart");
    setCartItems([]);
  };

  // LOAD RAZORPAY SCRIPT
  const loadScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ONLINE PAYMENT
  const handlePayment = async () => {
    if (!validate()) return;
    setLoading(true);

    const res = await loadScript();
    if (!res) {
      toast.error("Razorpay failed to load. Check your internet.");
      setLoading(false);
      return;
    }

    const options = {
      key: "rzp_test_So0gEOgmRU7SfI", // ← your existing Razorpay key
      amount: total * 100,
      currency: "INR",
      name: "FitCraft",
      description: "Fitness Product Payment",
      prefill: {
        name: form.name,
        email: form.email || "customer@fitcraft.com",
        contact: form.phone,
      },
      theme: { color: "#000000" },

      handler: async function (response: any) {
        await saveOrderToSupabase(response.razorpay_payment_id, "razorpay");
        clearCart();
        setLoading(false);
        toast.success("Payment Successful! Order placed.");
        navigate({ to: "/" }); // ← redirects to homepage after order
      },

      modal: {
        ondismiss: () => {
          setLoading(false);
          toast.error("Payment cancelled.");
        },
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on("payment.failed", (response: any) => {
      toast.error("Payment failed: " + response.error.description);
      setLoading(false);
    });
    paymentObject.open();
  };

  // CASH ON DELIVERY
  const handleCOD = async () => {
    if (!validate()) return;
    setLoading(true);
    await saveOrderToSupabase("COD-" + Date.now(), "cod");
    clearCart();
    setLoading(false);
    toast.success("Order placed successfully! We'll deliver soon.");
    navigate({ to: "/" });
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 text-4xl font-bold">Checkout</h1>

      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {/* CART ITEMS */}
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-24 w-24 rounded-md object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{item.name}</h2>
                      <p>Quantity: {item.quantity}</p>
                      <p className="font-bold">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded bg-red-500 px-4 py-2 text-sm text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CUSTOMER DETAILS FORM */}
          <div className="mt-10 rounded-lg border p-6">
            <h2 className="mb-6 text-2xl font-bold">Delivery Details</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Full Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full rounded-md border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Phone Number *
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full rounded-md border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Email (optional)
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full rounded-md border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="House no, Street, Area, City, State"
                  rows={3}
                  className="w-full rounded-md border px-4 py-3 text-sm outline-none focus:border-black resize-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">
                  Pincode *
                </label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className="w-full rounded-md border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              {/* FORM ERROR */}
              {formError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}
            </div>
          </div>

          {/* ORDER TOTAL + PAYMENT BUTTONS */}
          <div className="mt-6 rounded-lg border p-6">
            <h2 className="text-2xl font-bold">
              Total: ₹{total.toLocaleString("en-IN")}
            </h2>

            <div className="mt-6 space-y-4">
              {/* ONLINE PAYMENT */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full rounded-md bg-black px-6 py-4 text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : "Pay with Razorpay"}
              </button>

              {/* CASH ON DELIVERY */}
              <button
                onClick={handleCOD}
                disabled={loading}
                className="w-full rounded-md bg-green-600 px-6 py-4 text-white disabled:opacity-50"
              >
                {loading ? "Placing order..." : "Cash on Delivery"}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              🔒 Secured by Razorpay · 100% Safe Checkout
            </p>
          </div>
        </>
      )}
    </div>
  );
}
