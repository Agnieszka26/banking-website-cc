import type { ReactNode } from "react";

type AuthLayoutProps = {
	children: ReactNode;
	id: string;
};

/** Centered layout wrapper for sign-in and sign-up pages. */
export function AuthLayout({ children, id }: AuthLayoutProps) {
	return (
		<section
			id={id}
			className="flex items-center justify-center py-8 sm:py-12 px-4"
		>
			{children}
		</section>
	);
}
