// Outlets offered with one click when adding a source. Anything else is
// added by typing its website. The api searches each one through Google News
// by its domain, so the domain is what matters here, the name is a label
export type Outlet = {
	name: string;
	domain: string;
	category:
		| "Wire"
		| "Broadcaster"
		| "National"
		| "Business"
		| "Legal"
		| "Local";
};

export const OUTLETS: Outlet[] = [
	{ name: "BBC News", domain: "bbc.co.uk", category: "Broadcaster" },
	{ name: "Sky News", domain: "news.sky.com", category: "Broadcaster" },
	{ name: "ITV News", domain: "itv.com", category: "Broadcaster" },
	{ name: "Channel 4 News", domain: "channel4.com", category: "Broadcaster" },
	{ name: "Reuters", domain: "reuters.com", category: "Wire" },
	{ name: "AP News", domain: "apnews.com", category: "Wire" },
	{ name: "The Guardian", domain: "theguardian.com", category: "National" },
	{ name: "The Times", domain: "thetimes.com", category: "National" },
	{ name: "The Telegraph", domain: "telegraph.co.uk", category: "National" },
	{
		name: "The Independent",
		domain: "independent.co.uk",
		category: "National",
	},
	{ name: "Daily Mail", domain: "dailymail.co.uk", category: "National" },
	{ name: "The Mirror", domain: "mirror.co.uk", category: "National" },
	{ name: "The Sun", domain: "thesun.co.uk", category: "National" },
	{ name: "Financial Times", domain: "ft.com", category: "Business" },
	{ name: "Law Gazette", domain: "lawgazette.co.uk", category: "Legal" },
	{ name: "Legal Cheek", domain: "legalcheek.com", category: "Legal" },
	{ name: "Evening Standard", domain: "standard.co.uk", category: "Local" },
	{ name: "Metro", domain: "metro.co.uk", category: "Local" },
];
