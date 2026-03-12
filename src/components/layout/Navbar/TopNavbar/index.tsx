"use client";

import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import Link from "next/link";
import React from "react";
import { NavMenu } from "../navbar.types";
import { MenuList } from "./MenuList";
import { NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu";
import { MenuItem } from "./MenuItem";
import Image from "next/image";
import InputGroup from "@/components/ui/input-group";
import ResTopNavbar from "./ResTopNavbar";
import CartBtn from "./CartBtn";
import { useUiPreferences } from "@/lib/ui-preferences";
import { Moon, Sun } from "lucide-react";

const TopNavbar = () => {
  const { locale, setLocale, theme, setTheme, t } = useUiPreferences();
  const data: NavMenu = [
    {
      id: 1,
      label: t("nav.shop"),
      type: "MenuList",
      children: [
        {
          id: 11,
          label: t("nav.men"),
          url: "/shop?section=men-clothes",
          description: "",
        },
        {
          id: 12,
          label: t("nav.women"),
          url: "/shop?section=women-clothes",
          description: "",
        },
        {
          id: 13,
          label: t("nav.kids"),
          url: "/shop?section=kids-clothes",
          description: "",
        },
        {
          id: 14,
          label: t("nav.bagsShoes"),
          url: "/shop?section=bag-shoes",
          description: "",
        },
      ],
    },
    {
      id: 2,
      type: "MenuItem",
      label: t("nav.onSale"),
      url: "/shop?section=on-sale",
      children: [],
    },
    {
      id: 3,
      type: "MenuItem",
      label: t("nav.newArrivals"),
      url: "/shop?section=new-arrivals",
      children: [],
    },
    {
      id: 4,
      type: "MenuItem",
      label: t("nav.brands"),
      url: "/shop?section=brands",
      children: [],
    },
  ];

  return (
    <nav className="sticky top-0 bg-background z-20 border-b border-border">
      <div className="flex relative max-w-frame mx-auto items-center justify-between md:justify-start py-5 md:py-6 px-4 xl:px-0">
        <div className="flex items-center">
          <div className="block md:hidden mr-4">
            <ResTopNavbar data={data} />
          </div>
          <Link
            href="/"
            className={cn([
              integralCF.className,
              "text-2xl lg:text-[32px] mb-2 mr-3 lg:mr-10 whitespace-nowrap",
            ])}
          >
            IKA SUGU
          </Link>
        </div>
        <NavigationMenu className="hidden md:flex mr-2 lg:mr-7">
          <NavigationMenuList>
            {data.map((item) => (
              <React.Fragment key={item.id}>
                {item.type === "MenuItem" && (
                  <MenuItem label={item.label} url={item.url} />
                )}
                {item.type === "MenuList" && (
                  <MenuList data={item.children} label={item.label} />
                )}
              </React.Fragment>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <InputGroup className="hidden md:flex bg-surface-section mr-3 lg:mr-10">
          <InputGroup.Text>
            <Image
              priority
              src="/icons/search.svg"
              height={20}
              width={20}
              alt="search"
              className="min-w-5 min-h-5 dark:invert"
            />
          </InputGroup.Text>
          <InputGroup.Input
            type="search"
            name="search"
            placeholder={t("nav.searchPlaceholder")}
            className="bg-transparent placeholder:text-foreground/40 text-foreground"
          />
        </InputGroup>
        <div className="flex items-center">
          <button
            type="button"
            className="mr-1 p-2 rounded-full hover:bg-surface-section transition-colors"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="toggle theme"
            title={theme === "dark" ? t("nav.themeLight") : t("nav.themeDark")}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "fr" : "en")}
            className="mr-2 text-xs font-semibold px-1.5 py-1 rounded hover:bg-surface-section transition-colors text-foreground/70 hover:text-foreground"
            aria-label="toggle language"
          >
            {locale === "en" ? "FR" : "EN"}
          </button>
          <Link href="/search" className="block md:hidden mr-[14px] p-1">
            <Image
              priority
              src="/icons/search-black.svg"
              height={100}
              width={100}
              alt="search"
              className="max-w-[22px] max-h-[22px] dark:invert"
            />
          </Link>
          <CartBtn />
          <Link href="/account" className="p-1">
            <Image
              priority
              src="/icons/user.svg"
              height={100}
              width={100}
              alt="user"
              className="max-w-[22px] max-h-[22px] dark:invert"
            />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
