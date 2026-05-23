declare global {
  interface Window {
    Razorpay: any;
  }
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // LOAD CART ITEMS
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
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // PAYMENT
  const handlePayment = async () => {
    // LOAD SCRIPT
    const loadScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");

        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => {
          resolve(true);
        };

        script.onerror = () => {
          resolve(false);
        };

        document.body.appendChild(script);
      });
    };

    const res = await loadScript();

    if (!res) {
      toast.error("Razorpay failed to load");
      return;
    }

    const options = {
      key: "rzp_test_So0gEOgmRU7SfI",

      amount: total * 100,

      currency: "INR",

      name: "FitCraft",

      description: "Fitness Product Payment",

      handler: function (response: any) {
        toast.success("Payment Successful");

        console.log(response);

        localStorage.removeItem("cart");

        setCartItems([]);
      },

      prefill: {
        name: "Customer",
        email: "customer@gmail.com",
        contact: "9999999999",
      },

      theme: {
        color: "#000000",
      },
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.open();
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 text-4xl font-bold">Checkout</h1>

      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-lg border p-4">
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

          <div className="mt-10 rounded-lg border p-6">
            <h2 className="text-2xl font-bold">Total: ₹{total.toLocaleString("en-IN")}</h2>

            <div className="mt-6 space-y-4">
              {/* ONLINE PAYMENT */}
              <button
                onClick={handlePayment}
                className="w-full rounded-md bg-black px-6 py-4 text-white"
              >
                Pay with Razorpay
              </button>

              {/* CASH ON DELIVERY */}
              <button
                onClick={() => {
                  toast.success("Order placed successfully");

                  localStorage.removeItem("cart");

                  setCartItems([]);
                }}
                className="w-full rounded-md bg-green-600 px-6 py-4 text-white"
              >
                Cash on Delivery
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
