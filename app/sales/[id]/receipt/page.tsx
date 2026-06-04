"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ReceiptItem = {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
};

type ReceiptResponse = {
  business: {
    name: string;
    address: string;
    phone: string;
  };
  receipt: {
    invoice_number: string;
    payment_method: string;
    total_amount: string | number;
    date: string;
    items: ReceiptItem[];
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();

  const [data, setData] = useState<ReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const saleId = params.id;

  useEffect(() => {
    async function loadReceipt() {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/sales/${saleId}/receipt`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const receiptData = await response.json();

      setData(receiptData);
      setLoading(false);
    }

    loadReceipt();
  }, [saleId]);

  function formatCurrency(value: string | number) {
    return `KES ${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-500">Loading receipt...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-red-500">Receipt not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm print:border-none print:shadow-none">
        <CardContent className="p-8">
          <div className="text-center border-b pb-6">
            <h1 className="text-3xl font-black uppercase">
              {data.business.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {data.business.address}
            </p>

            <p className="text-sm text-slate-500">
              {data.business.phone}
            </p>

            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Sales Receipt
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b py-6 text-sm">
            <div>
              <p className="text-slate-500">Invoice Number</p>
              <p className="font-bold">{data.receipt.invoice_number}</p>
            </div>

            <div className="text-right">
              <p className="text-slate-500">Date</p>
              <p className="font-bold">{data.receipt.date}</p>
            </div>

            <div>
              <p className="text-slate-500">Payment Method</p>
              <p className="font-bold uppercase">
                {data.receipt.payment_method}
              </p>
            </div>

            <div className="text-right">
              <p className="text-slate-500">Status</p>
              <p className="font-bold text-emerald-600">PAID</p>
            </div>
          </div>

          <div className="py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-3">Item</th>
                  <th className="py-3">SKU</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 text-right">Price</th>
                  <th className="py-3 text-right">Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {data.receipt.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 font-medium">
                      {item.product_name}
                    </td>

                    <td className="py-3 text-slate-500">
                      {item.sku}
                    </td>

                    <td className="py-3 text-center">
                      {item.quantity}
                    </td>

                    <td className="py-3 text-right">
                      {formatCurrency(item.unit_price)}
                    </td>

                    <td className="py-3 text-right font-semibold">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end border-t pt-6">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total</span>
                <span className="font-black">
                  {formatCurrency(data.receipt.total_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-xs text-slate-500">
            <p>Thank you for shopping with us.</p>
            <p className="mt-1">
              Goods once sold are subject to company return policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}