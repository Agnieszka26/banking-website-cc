import { PostHogProvider } from "@posthog/react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { FontScaleProvider } from "#/components/FontScaleProvider";
import Footer from "#/components/Footer";
import { Navbar } from "#/components/Navbar";
import appCss from "../styles.css?url";

const fontScaleInitScript = `(function(){try{var k=${JSON.stringify("banking-app-font-scale")};var px=[14,15,16,18,20];var v=localStorage.getItem(k);var n=v===null?2:parseInt(v,10);n=Number.isNaN(n)?2:Math.min(4,Math.max(0,n));var r=document.documentElement;r.style.setProperty("--font-scale",String(px[n]/16));r.style.fontSize=px[n]+"px";r.dataset.fontScale=String(n);}catch(e){}})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Baking App",
			},
			{
				name: "description",
				content: "Baking App",
			},
			{
				name: "keywords",
				content: "Baking App",
			},
			{
				name: "author",
				content: "Baking App",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	component: RootLayout,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: fontScaleInitScript }} />
				<HeadContent />
			</head>
			<body className="flex min-h-screen flex-col">
				<PostHogProvider
					apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ?? ""}
					options={{
						api_host: "/ingest",
						ui_host:
							import.meta.env.VITE_PUBLIC_POSTHOG_HOST ||
							"https://eu.posthog.com",
						defaults: "2025-05-24",
						capture_exceptions: true,
						debug: import.meta.env.DEV,
						before_send: (event) =>
							import.meta.env.DEV ? null : event,
					}}
				>
					<FontScaleProvider>{children}</FontScaleProvider>
				</PostHogProvider>
				<Scripts />
			</body>
		</html>
	);
}

function RootLayout() {
	return (
		<>
			<header className="w-full shrink-0">
				<Navbar />
			</header>

			<main className="flex flex-1 flex-col pb-24">
				<Outlet />
			</main>

			<Footer />

			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</>
	);
}
