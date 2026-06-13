"use client";

import { useState } from "react";
import { OrderStatus } from "@/generated/prisma/client";
import { updateOrderStatusAction } from "@/app/actions/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTransition } from "react";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  messages: {
    [key in OrderStatus]: string;
  };
};

export default function OrderStatusUpdate({ orderId, currentStatus, messages }: Props) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: OrderStatus) => {
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, newStatus);
        setStatus(newStatus);
        toast.success("Order status updated successfully");
      } catch (error) {
        toast.error("Failed to update order status");
        console.error(error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        disabled={isPending}
        value={status}
        onValueChange={(value) => handleStatusChange(value as OrderStatus)}
      >
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(messages).map(([value, label]) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
