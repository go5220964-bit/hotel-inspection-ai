"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface BranchItem {
  id: string;
  name: string;
  code: string;
  city?: string;
  apartmentsCount?: number;
  openIssuesCount?: number;
  unreadyCount?: number;
}

interface BranchContextType {
  currentBranch: BranchItem | null;
  setCurrentBranch: (branch: BranchItem | null) => void;
  branches: BranchItem[];
  loading: boolean;
  refreshBranches: () => void;
}

const BranchContext = createContext<BranchContextType>({
  currentBranch: null,
  setCurrentBranch: () => {},
  branches: [],
  loading: true,
  refreshBranches: () => {},
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [currentBranch, setCurrentBranchState] = useState<BranchItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranches = () => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setBranches(data.data);
          const savedBranchId = typeof window !== "undefined" ? localStorage.getItem("selectedBranchId") : null;
          if (savedBranchId) {
            const found = data.data.find((b: any) => b.id === savedBranchId);
            if (found) setCurrentBranchState(found);
            else if (data.data.length > 0) setCurrentBranchState(data.data[0]);
          } else if (data.data.length > 0) {
            setCurrentBranchState(data.data[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const setCurrentBranch = (branch: BranchItem | null) => {
    setCurrentBranchState(branch);
    if (typeof window !== "undefined") {
      if (branch) localStorage.setItem("selectedBranchId", branch.id);
      else localStorage.removeItem("selectedBranchId");
    }
  };

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        setCurrentBranch,
        branches,
        loading,
        refreshBranches: fetchBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);