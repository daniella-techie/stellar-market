import Link from "next/link";
import { Shield, Star, Scale, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-theme-heading mb-6 leading-tight">
            Work Without Borders.{" "}
            <span className="bg-gradient-to-r from-stellar-blue to-stellar-purple bg-clip-text text-transparent">
              Pay Without Trust.
            </span>
          </h1>
          <p className="text-xl text-theme-text mb-10 max-w-2xl mx-auto">
            The decentralized freelance marketplace powered by Stellar. Smart
            contract escrow, on-chain reputation, and trustless dispute
            resolution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/jobs" className="btn-primary flex items-center gap-2">
              Browse Jobs <ArrowRight size={18} />
            </Link>
            <Link href="/post-job" className="btn-secondary">
              Post a Job
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-theme-heading text-center mb-12">
          Built for Trust
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-14 h-14 bg-stellar-blue/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-stellar-blue" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-theme-heading mb-3">
              Escrow Payments
            </h3>
            <p className="text-theme-text">
              Funds are locked in Soroban smart contracts and released only when
              milestones are approved. No middleman needed.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-14 h-14 bg-stellar-purple/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="text-stellar-purple" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-theme-heading mb-3">
              On-Chain Reputation
            </h3>
            <p className="text-theme-text">
              Stake-weighted reviews stored on Stellar. Build a portable,
              tamper-proof reputation across the ecosystem.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-14 h-14 bg-theme-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Scale className="text-theme-success" size={28} />
            </div>
            <h3 className="text-xl font-semibold text-theme-heading mb-3">
              Dispute Resolution
            </h3>
            <p className="text-theme-text">
              Decentralized arbitration with community voters. Fair resolution
              without centralized authority.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-theme-heading text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Post a Job", desc: "Describe your project, set milestones and budget" },
            { step: "02", title: "Get Applications", desc: "Review freelancer profiles and proposals" },
            { step: "03", title: "Escrow Funded", desc: "Funds locked in smart contract on acceptance" },
            { step: "04", title: "Work & Pay", desc: "Approve milestones to release payments" },
          ].map((item) => (
            <div key={item.step} className="card text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-stellar-blue to-stellar-purple bg-clip-text text-transparent mb-3">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-theme-heading mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-theme-text">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-theme-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2,400+", label: "Jobs Posted" },
              { value: "8,100+", label: "Freelancers" },
              { value: "1.2M", label: "XLM in Escrow" },
              { value: "98%", label: "Disputes Resolved" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-stellar-blue to-stellar-purple bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-theme-text mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
