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

// Whether a matter's ask panel is showing. Open by default on arriving at a
// matter, the header's Ask button toggles it
export const AskPanelContext = createContext<{
	open: boolean;
	setOpen: (open: boolean) => void;
}>({ open: true, setOpen: () => {} });

export function useAskPanel() {
	return useContext(AskPanelContext);
}
