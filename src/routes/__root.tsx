import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Navbar } from "#/components/Navbar";
import appCss from "../styles.css?url";
import Footer from "#/components/Footer";
import { ClerkProvider } from '@clerk/tanstack-react-start'

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
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
			<ClerkProvider>
				<header className="w-full shrink-0">
					<Navbar />
				</header>
				<main>
					{children}
					<Footer />
				</main>
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
				<Scripts />
				</ClerkProvider>
			</body>
		</html>
	);
}
