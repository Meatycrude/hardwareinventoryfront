"use client";

import { useMemo, useState } from "react";
import {
  Lock,
  Printer,
  Search,
  X,
  Plus,
  Trash2,
  ShoppingCart,
} from "lucide-react";

type CartItem = {
  id: number;
  product: string;
  qty: number;
  unit: string;
  price: number;
};

export default function SalesPage() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");

  const [productName, setProductName] = useState("");
  const [unit, setUnit] = useState("Pcs");
  const [quantity, setQuantity] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const [selectedPayment, setSelectedPayment] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<CartItem[]>([
    { id: 1, product: "128GB Boost", qty: 3, unit: "Pcs", price: 1500 },
    { id: 2, product: "64GB Boost", qty: 5, unit: "Pcs", price: 1000 },
    { id: 3, product: "32GB Boost", qty: 10, unit: "Pcs", price: 650 },
    { id: 4, product: "sandisk 128gb", qty: 3, unit: "Pcs", price: 1500 },
    { id: 5, product: "64GB Sandisk", qty: 5, unit: "Pcs", price: 800 },
    { id: 6, product: "32GB Sandisk", qty: 15, unit: "Pcs", price: 550 },
    { id: 7, product: "16GB Sandisk", qty: 20, unit: "Pcs", price: 430 },
    { id: 8, product: "8GB Sandisk", qty: 10, unit: "Pcs", price: 350 },
  ]);

  const paymentMethods = [
    "Account",
    "Cash",
    "Mpesa Till",
    "EQUITY",
    "FAMILY",
    "Eunice Phone",
    "Miscellaneous",
    "Reconciliation",
  ];

  const today = new Date().toISOString().split("T")[0];

  const receiptNumber = useMemo(() => {
    return `RCT-${new Date().getFullYear()}-${String(items.length + 1).padStart(
      4,
      "0",
    )}`;
  }, [items.length]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty * item.price, 0);
  }, [items]);

  const currentSubtotal = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(sellingPrice) || 0;

    return qty * price;
  }, [quantity, sellingPrice]);

  const amountReceived = Number(cashReceived) || 0;

  const change = amountReceived > total ? amountReceived - total : 0;

  const balance = amountReceived < total ? total - amountReceived : 0;

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const addItem = () => {
    if (!productName.trim()) {
      alert("Enter product name");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      alert("Enter valid quantity");
      return;
    }

    if (!sellingPrice || Number(sellingPrice) <= 0) {
      alert("Enter valid selling price");
      return;
    }

    const newItem: CartItem = {
      id: Date.now(),
      product: productName,
      qty: Number(quantity),
      unit,
      price: Number(sellingPrice),
    };

    setItems((prev) => [newItem, ...prev]);

    setProductName("");
    setUnit("Pcs");
    setQuantity("");
    setSellingPrice("");
  };

  const updateItem = (id: number, field: "qty" | "price", value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: Number(value) || 0,
            }
          : item,
      ),
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    const confirmed = confirm("Are you sure you want to clear the cart?");

    if (!confirmed) return;

    setItems([]);
    setCashReceived("");
    setNotes("");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-[#cfcfcf] p-2 text-sm text-black sm:p-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1500px] overflow-hidden border border-gray-500 bg-[#e5e5e5] shadow-lg print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex h-14 items-center justify-between bg-[#1d4f91] px-4 text-white print:hidden">
          <h1 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
            <ShoppingCart size={20} />
            Sales / POS
          </h1>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded bg-gray-100 px-3 py-2 text-sm text-black shadow hover:bg-white sm:px-4"
          >
            <Printer size={18} />
            Print
          </button>
        </div>

        {/* Mobile total */}
        <div className="sticky top-0 z-20 block bg-[#294d87] p-4 text-center text-3xl font-light tracking-wide text-white shadow-md lg:hidden print:hidden">
          KES. {formatMoney(total)}
        </div>

        <div className="relative grid grid-cols-1 gap-4 p-3 sm:p-5 lg:grid-cols-[1fr_250px]">
          {/* Desktop total */}
          <div className="absolute right-[280px] top-5 hidden bg-[#294d87] px-14 py-5 text-5xl font-light tracking-wider text-white shadow-md lg:block print:static print:mb-4 print:block print:w-full print:text-center print:text-3xl">
            KES. {formatMoney(total)}
          </div>

          {/* Left section */}
          <section className="space-y-5 pt-2">
            {/* Customer section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[330px_260px_1fr]">
              <div>
                <label className="mb-1 block font-semibold underline">
                  Search Customer (F3)
                </label>
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer..."
                  className="h-10 w-full border border-gray-400 bg-white px-3 outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Date:</label>
                <input
                  value={today}
                  readOnly
                  className="h-10 w-full border border-gray-400 bg-white px-3 font-semibold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[330px_300px_1fr]">
              <div>
                <label className="mb-1 block font-semibold">
                  Customer Name
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="h-14 w-full border border-gray-400 bg-white px-3 outline-none focus:border-blue-700 sm:h-16"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold">Phone No</label>
                <input
                  value={phoneNo}
                  onChange={(e) => setPhoneNo(e.target.value)}
                  placeholder="Phone number"
                  className="h-14 w-full border border-gray-400 bg-white px-3 outline-none focus:border-blue-700 sm:h-16"
                />
              </div>
            </div>

            {/* Product entry */}
            <div className="rounded border border-gray-400 bg-[#dddddd] p-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_150px_130px_130px_120px_90px]">
                <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                  <label className="mb-1 block font-semibold underline">
                    Search Product (Ctrl + S)
                  </label>
                  <div className="flex h-11 border border-blue-800 bg-white">
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name..."
                      className="flex-1 px-3 outline-none"
                    />
                    <Search className="m-2 text-gray-500" size={20} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Unit</label>
                  <input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-11 w-full border border-gray-400 bg-white px-3 outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Quantity</label>
                  <input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    type="number"
                    min="1"
                    placeholder="0"
                    className="h-11 w-full border border-gray-400 bg-white px-3 outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold">
                    Selling Price
                  </label>
                  <input
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="h-11 w-full border border-gray-400 bg-white px-3 outline-none focus:border-blue-700"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Sub Total</label>
                  <div className="flex h-11 items-center border border-gray-300 bg-[#eeeeee] px-2 font-bold">
                    {formatMoney(currentSubtotal)}
                  </div>
                </div>

                <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-1">
                  <button
                    onClick={addItem}
                    className="flex h-11 w-full items-center justify-center gap-2 bg-[#1d4f91] px-3 font-bold text-white hover:bg-[#163f75]"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <p className="font-semibold">
                Items in cart:{" "}
                <span className="text-[#1d4f91]">{items.length}</span>
              </p>

              <button
                onClick={clearCart}
                disabled={items.length === 0}
                className="flex items-center justify-center gap-2 border border-red-500 px-4 py-2 font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={17} />
                Clear Cart
              </button>
            </div>

            {/* Mobile cart cards */}
            <div className="space-y-3 lg:hidden">
              {items.length === 0 ? (
                <div className="border border-gray-400 bg-white p-5 text-center font-semibold text-gray-500">
                  No items added yet.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-400 bg-[#eeeeee] p-3 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold">{item.product}</h3>
                        <p className="text-xs text-gray-600">{item.unit}</p>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 print:hidden"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold">Qty</label>
                        <input
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(item.id, "qty", e.target.value)
                          }
                          type="number"
                          className="h-10 w-full border border-gray-400 bg-white px-3 font-semibold outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold">
                          Price
                        </label>
                        <input
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", e.target.value)
                          }
                          type="number"
                          className="h-10 w-full border border-gray-400 bg-white px-3 font-semibold outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between border-t border-gray-300 pt-2 font-bold">
                      <span>Total</span>
                      <span>KES. {formatMoney(item.qty * item.price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden w-full overflow-x-auto lg:block">
              <table className="w-full min-w-[850px] border-collapse bg-[#eeeeee] text-left">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="px-7 py-3 text-base">Product</th>
                    <th className="px-3 py-3 text-base">Qty</th>
                    <th className="px-3 py-3 text-base">Unit</th>
                    <th className="px-3 py-3 text-base">Price</th>
                    <th className="px-3 py-3 text-base">Total</th>
                    <th className="px-3 py-3 text-base print:hidden">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-7 py-8 text-center font-semibold text-gray-500"
                      >
                        No items added yet.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td className="px-7 py-2 text-base font-semibold">
                          {item.product}
                        </td>

                        <td className="px-3 py-2">
                          <input
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(item.id, "qty", e.target.value)
                            }
                            type="number"
                            className="h-9 w-28 border border-gray-400 bg-white px-3 text-base font-semibold outline-none"
                          />
                        </td>

                        <td className="px-3 py-2 text-base font-semibold">
                          {item.unit}
                        </td>

                        <td className="px-3 py-2">
                          <input
                            value={item.price}
                            onChange={(e) =>
                              updateItem(item.id, "price", e.target.value)
                            }
                            type="number"
                            className="h-9 w-32 border border-gray-400 bg-white px-3 text-base font-semibold outline-none"
                          />
                        </td>

                        <td className="px-3 py-2 text-base font-bold">
                          {formatMoney(item.qty * item.price)}
                        </td>

                        <td className="px-3 py-2 print:hidden">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500"
                          >
                            <X size={26} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Payment sidebar */}
          <aside className="border-t border-gray-400 bg-[#dddddd] p-4 lg:border-l lg:border-t-0">
            <div className="mb-5">
              <label className="mb-1 block font-semibold">Receipt No.</label>
              <input
                value={receiptNumber}
                readOnly
                className="h-9 w-full border border-gray-400 bg-white px-3 font-semibold outline-none"
              />
            </div>

            <div className="mb-5 flex items-center gap-2">
              <Lock size={22} />
              <span className="font-semibold">Pin No (F9)</span>
            </div>

            <h2 className="mb-3 text-lg font-bold">Payment</h2>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 print:hidden">
              {paymentMethods.map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={`w-full border px-4 py-4 text-left text-sm font-bold sm:text-base ${
                    selectedPayment === method
                      ? "border-[#1d4f91] bg-[#1d4f91] text-white"
                      : "border-gray-300 bg-[#e8e2d9] text-black hover:bg-white"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block font-bold">SELECTED PAYMENT</label>
                <input
                  value={selectedPayment}
                  readOnly
                  className="h-10 w-full border border-gray-400 bg-white px-3 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold">AMOUNT RECEIVED</label>
                <input
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-10 w-full border border-gray-400 bg-white px-3 outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold">CHANGE (CASH)</label>
                <input
                  value={formatMoney(change)}
                  readOnly
                  className="h-10 w-full border border-gray-400 bg-white px-3 font-bold text-green-700 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold">BALANCE</label>
                <input
                  value={formatMoney(balance)}
                  readOnly
                  className="h-10 w-full border border-gray-400 bg-white px-3 font-bold text-red-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block font-semibold">Notes / Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add payment details..."
                  className="h-20 w-full border border-gray-400 bg-white p-2 outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="mt-5 border-t border-gray-400 pt-4">
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>KES. {formatMoney(total)}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm font-semibold">
                <span>Received</span>
                <span>KES. {formatMoney(amountReceived)}</span>
              </div>

              <div className="mt-2 flex justify-between text-sm font-semibold">
                <span>Balance</span>
                <span>KES. {formatMoney(balance)}</span>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="mt-5 flex w-full items-center justify-center gap-2 bg-[#1d4f91] px-4 py-3 font-bold text-white hover:bg-[#163f75] print:hidden"
            >
              <Printer size={18} />
              Print Receipt
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
