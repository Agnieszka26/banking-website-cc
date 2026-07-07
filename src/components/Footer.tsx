import { Link } from "@tanstack/react-router";
import { ArrowUp, Send } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useId, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	companyName,
	companyTagline,
	contactItems,
	type FooterNavLink,
	resourceLinks,
	socialLinks,
} from "#/config/footer";
import { cn } from "@/lib/utils";
import logo from "../../public/assets/logo.png";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateNewsletterEmail(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return "Podaj adres e-mail.";
	}
	if (!EMAIL_PATTERN.test(trimmed)) {
		return "Wprowadź poprawny adres e-mail.";
	}
	return null;
}

type FooterLinkListProps = {
	title: string;
	links: FooterNavLink[];
};

function FooterLinkList({ title, links }: FooterLinkListProps) {
	return (
		<nav aria-label={title}>
			<h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
				{title}
			</h2>
			<ul className="mt-4 space-y-2.5">
				{links.map((link) => (
					<li key={link.label}>
						<Link
							to={link.to}
							className="group inline-flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						>
							<span className="relative">
								{link.label}
								<span
									aria-hidden
									className="absolute -bottom-px left-0 h-px w-0 bg-bank-green transition-all duration-300 group-hover:w-full"
								/>
							</span>
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}

function FooterNewsletter() {
	const formId = useId();
	const emailId = `${formId}-email`;
	const errorId = `${formId}-error`;
	const successId = `${formId}-success`;

	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const validationError = validateNewsletterEmail(email);
		setError(validationError);
		if (validationError) {
			setSubmitted(false);
			return;
		}
		setSubmitted(true);
		setError(null);
	};

	const handleBlur = () => {
		if (email.trim()) {
			setError(validateNewsletterEmail(email));
		}
	};

	return (
		<section aria-labelledby={`${formId}-heading`}>
			<h2
				id={`${formId}-heading`}
				className="font-heading text-sm font-semibold tracking-tight text-foreground"
			>
				Newsletter
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
				Otrzymuj aktualności, porady i informacje o bezpieczeństwie — bez spamu.
			</p>

			<form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
				<div className="space-y-2">
					<Label htmlFor={emailId} className="sr-only">
						Adres e-mail
					</Label>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Input
							id={emailId}
							name="email"
							type="email"
							autoComplete="email"
							inputMode="email"
							placeholder="twoj@email.pl"
							value={email}
							onChange={(event: ChangeEvent<HTMLInputElement>) => {
								const value = event.target.value;
								setEmail(value);
								if (error) {
									setError(validateNewsletterEmail(value));
								}
								if (submitted) {
									setSubmitted(false);
								}
							}}
							onBlur={handleBlur}
							aria-invalid={error ? true : undefined}
							aria-describedby={
								error ? errorId : submitted ? successId : undefined
							}
							className={cn(
								"h-10 flex-1 bg-background/80 shadow-sm transition-shadow duration-200",
								"focus-visible:shadow-md",
								error && "border-destructive",
							)}
						/>
						<Button
							type="submit"
							className="h-10 shrink-0 gap-2 bg-bank-green text-white shadow-sm transition-all duration-200 hover:bg-bank-green/90 hover:shadow-md focus-visible:ring-bank-green/40"
						>
							<Send className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5" />
							Zapisz się
						</Button>
					</div>
					{error ? (
						<p id={errorId} role="alert" className="text-xs text-destructive">
							{error}
						</p>
					) : null}
					{submitted && !error ? (
						<p
							id={successId}
							className="text-xs text-bank-green dark:text-bank-green"
						>
							Dziękujemy! Sprawdź skrzynkę, aby potwierdzić subskrypcję.
						</p>
					) : null}
				</div>
			</form>
		</section>
	);
}

function BackToTopButton() {
	const scrollToTop = useCallback(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	return (
		<Button
			type="button"
			variant="outline"
			size="icon-sm"
			onClick={scrollToTop}
			aria-label="Wróć na górę strony"
			className="rounded-full border-border/80 bg-background/80 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-bank-green/30 hover:shadow-md"
		>
			<ArrowUp className="size-4" />
		</Button>
	);
}

export default function Footer() {
	const year = new Date().getFullYear();

	return (
		<footer className="relative mt-auto w-full border-t border-border/60 bg-bank-bg/50 dark:bg-card/40">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-bank-green/40 to-transparent"
			/>

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid gap-10 py-12 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:gap-10 lg:py-16">
					<div className="lg:col-span-4">
						<Link
							to="/"
							className="inline-flex rounded-lg transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						>
							<img
								src={logo}
								alt={`${companyName} — strona główna`}
								className="size-14 object-contain sm:size-16"
							/>
						</Link>
						<p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
							{companyTagline}
						</p>
						<div className="mt-6 flex gap-2">
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={social.label}
									className="inline-flex size-9 items-center justify-center rounded-full border border-border/80 bg-background/60 text-muted-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-bank-green/30 hover:text-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
								>
									<social.icon className="size-4" />
								</a>
							))}
						</div>
					</div>

					<div className="lg:col-span-2">
						<FooterLinkList title="Zasoby" links={resourceLinks} />
					</div>

					<div className="lg:col-span-3">
						<h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
							Kontakt
						</h2>
						<ul className="mt-4 space-y-4">
							{contactItems.map((item) => (
								<li key={item.id}>
									<a
										href={item.href}
										className="group flex gap-3 rounded-xl p-1 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
										{...(item.id === "address"
											? { target: "_blank", rel: "noopener noreferrer" }
											: {})}
									>
										<span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-bank-green shadow-sm transition-all duration-200 group-hover:border-bank-green/30 group-hover:shadow-md">
											<item.icon className="size-4" aria-hidden />
										</span>
										<span className="min-w-0">
											<span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
												{item.label}
											</span>
											<span className="mt-0.5 block text-sm text-foreground/90 transition-colors group-hover:text-foreground">
												{item.value}
											</span>
										</span>
									</a>
								</li>
							))}
						</ul>
					</div>

					<div className="lg:col-span-3">
						<FooterNewsletter />
					</div>
				</div>

				<div className="flex flex-col items-center justify-between gap-4 border-t border-border/60 py-6 sm:flex-row">
					<p className="text-center text-xs text-muted-foreground sm:text-left">
						© {year} {companyName}. Wszelkie prawa zastrzeżone.
					</p>
					<BackToTopButton />
				</div>
			</div>
		</footer>
	);
}
