"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import axios from "axios";
import ServiceCard from "@/components/ServiceCard";
import Pagination from "@/components/Pagination";
import { ServiceListing, PaginatedResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SERVICES_PER_PAGE = 10;

const categories = ["All", "Frontend", "Backend", "Smart Contract", "Design", "Mobile", "Documentation"];

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: SERVICES_PER_PAGE,
      };
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (search) params.search = search;

      const res = await axios.get<PaginatedResponse<ServiceListing>>(`${API_URL}/services`, { params });
      setServices(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      setServices([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading mb-2">
            Discover Services
          </h1>
          <p className="text-theme-text">
            Find the perfect professional for your next project.
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/services/new'}
          className="btn-primary"
        >
          Post a Service
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text" size={18} />
          <input
            type="text"
            placeholder="Search services (e.g. 'React', 'Soroban')..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-stellar-blue text-white"
                  : "bg-theme-card border border-theme-border text-theme-text hover:border-stellar-blue"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Listings */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-theme-card border border-theme-border rounded-xl h-72" />
          ))}
        </div>
      ) : services.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={SERVICES_PER_PAGE}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-card border border-theme-border mb-4">
            <Search className="text-theme-text" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-theme-heading mb-2">No services found</h3>
          <p className="text-theme-text max-w-xs mx-auto">
            Try adjusting your search filters or browse other categories.
          </p>
        </div>
      )}
    </div>
  );
}
