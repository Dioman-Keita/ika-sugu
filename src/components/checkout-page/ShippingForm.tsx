"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useUiPreferences } from "@/lib/ui-preferences";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zip: string;
};

type ShippingFormProps = {
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
};

const inputClass =
  "w-full rounded-full bg-surface-section border border-transparent focus:border-border focus:outline-none px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all";

const labelClass = "block text-sm font-medium text-foreground mb-1.5";

const Field = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-col", className)}>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const ShippingForm = ({ onSubmit }: ShippingFormProps) => {
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    zip: "",
  });
  const { t } = useUiPreferences();

  const set =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col space-y-5">
      {/* Contact */}
      <div className="border border-border rounded-[20px] p-5 md:p-6 space-y-5">
        <h3 className="font-bold text-lg text-foreground">{t("checkout.contactInfo")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("checkout.firstName")}>
            <input
              required
              type="text"
              placeholder="John"
              value={form.firstName}
              onChange={set("firstName")}
              className={inputClass}
            />
          </Field>
          <Field label={t("checkout.lastName")}>
            <input
              required
              type="text"
              placeholder="Doe"
              value={form.lastName}
              onChange={set("lastName")}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("checkout.email")}>
            <input
              required
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={set("email")}
              className={inputClass}
            />
          </Field>
          <Field label={t("checkout.phone")}>
            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={form.phone}
              onChange={set("phone")}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* Shipping address */}
      <div className="border border-border rounded-[20px] p-5 md:p-6 space-y-5">
        <h3 className="font-bold text-lg text-foreground">
          {t("checkout.shippingAddress")}
        </h3>
        <Field label={t("checkout.streetAddress")}>
          <input
            required
            type="text"
            placeholder="123 Main Street"
            value={form.address}
            onChange={set("address")}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={t("checkout.city")} className="sm:col-span-1">
            <input
              required
              type="text"
              placeholder="New York"
              value={form.city}
              onChange={set("city")}
              className={inputClass}
            />
          </Field>
          <Field label={t("checkout.country")} className="sm:col-span-1">
            <select
              required
              value={form.country}
              onChange={set("country")}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="" disabled>
                {t("checkout.selectCountry")}
              </option>
              <option value="US">United States</option>
              <option value="FR">France</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="JP">Japan</option>
              <option value="SN">Senegal</option>
              <option value="CI">Côte d&apos;Ivoire</option>
            </select>
          </Field>
          <Field label={t("checkout.zip")} className="sm:col-span-1">
            <input
              required
              type="text"
              placeholder="10001"
              value={form.zip}
              onChange={set("zip")}
              className={inputClass}
            />
          </Field>
        </div>
      </div>
    </form>
  );
};

export default ShippingForm;
