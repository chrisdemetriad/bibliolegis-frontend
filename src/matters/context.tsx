import { createContext, useContext } from "react";
import type { Matter } from "#/mock/data";

// The matter layout works out whether an address is a real matter or a sample
// one and hands the result down, so the pages under it don't each have to
export const MatterContext = createContext<Matter | null>(null);

export function useMatter() {
	const matter = useContext(MatterContext);
	if (!matter) throw new Error("useMatter is only for pages under a matter");
	return matter;
}
