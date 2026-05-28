import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicProfileClient from "./PublicProfileClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getPublicProfile(username: string) {
  try {
    const res = await fetch(`${API_URL}/users/public/${encodeURIComponent(username)}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const profile = await getPublicProfile(params.username);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stellarmarket.io";
  const canonical = `${baseUrl}/profile/${params.username}`;

  if (!profile) {
    return {
      title: "Profile Not Found | StellarMarket",
      description: "The requested freelancer profile could not be found.",
      alternates: { canonical },
    };
  }

  const title = `${profile.username} — Freelancer | StellarMarket`;
  const description =
    profile.bio?.substring(0, 160) ||
    `Hire ${profile.username} on StellarMarket — decentralized freelance marketplace.`;
  const image = profile.avatarUrl ?? `${baseUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      images: [{ url: image, width: 1200, height: 630, alt: profile.username }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getPublicProfile(params.username);
  if (!profile) notFound();
  return <PublicProfileClient profile={profile} />;
}
