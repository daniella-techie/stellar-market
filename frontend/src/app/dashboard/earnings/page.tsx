import dynamic from "next/dynamic";

const EarningsPage = dynamic(() => import("../earnings-page"), {
  loading: () => <div className="flex items-center justify-center p-8">Loading...</div>,
});

export default function EarningsRoute() {
  return <EarningsPage />;
}
