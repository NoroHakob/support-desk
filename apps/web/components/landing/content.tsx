import {
  BookOpenText,
  MessagesSquare,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  current?: boolean;
};

export const navLinks: NavLink[] = [
  { label: "Home", href: "/", current: true },
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export const signInLink = { label: "Sign in", href: "/auth/sign-in" };

export const hero = {
  headline: ["Your support,", "on autopilot."],
  subhead:
    "The SupportDesk agent answers your visitors around the clock, straight from your knowledge base, so you're not stuck in the inbox. When it isn't sure, it hands the conversation to you.",
  cta: { label: "Get started", href: "/auth/sign-up" },
};

export const trust: {
  icons: { label: string; icon: LucideIcon }[];
  label: string;
} = {
  icons: [
    { label: "Visitors", icon: MessagesSquare },
    { label: "Knowledge base", icon: BookOpenText },
    { label: "You, when it matters", icon: UserRound },
  ],
  label: "Answers only from your knowledge base",
};

export type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

export const stats: Stat[] = [
  {
    prefix: "<",
    value: 10,
    suffix: "min",
    label: "From sign-up to a live widget",
  },
  { value: 100, suffix: "%", label: "Of messages classified first" },
  { value: 24, suffix: "/7", label: "Answers for your visitors" },
  { value: 1, label: "Snippet to install" },
];

// Third-party host until the video moves to our own object storage (DESIGN.md section 10).
export const backgroundVideoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4";
