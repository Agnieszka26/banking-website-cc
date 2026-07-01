/** Shown while dashboard auth `beforeLoad` verifies the session. */
export function AuthCheckPending() {
	return (
		<div className="flex flex-1 items-center justify-center bg-bank-bg py-24">
			<output className="text-sm text-muted-foreground" aria-live="polite">
				Sprawdzanie sesji...
			</output>
		</div>
	);
}
