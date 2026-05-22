import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold">Cart Page</h1>

      <Link to="/checkout" className="mt-5 inline-block rounded bg-black px-6 py-3 text-white">
        Go To Checkout
      </Link>
    </div>
  );
}
