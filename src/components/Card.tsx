import { Check, ShieldCheck } from "lucide-react";

const Card = () => {
	return (
		<article className="flex-1 p-5 sm:p-6 rounded-lg border border-gray-200 bg-card shadow-sm">
			<h2 className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl mb-4 sm:mb-5 text-green-800">
				<ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
				Bezpieczeństwo - zalecenia
			</h2>
			<ul className="space-y-3 sm:space-y-3.5">
				<li className="flex items-start gap-2 sm:gap-3">
					<Check className="w-5 h-5 shrink-0 mt-0.5 text-green-800" />
					<p className="text-sm sm:text-base leading-relaxed">
						Nie wchodź na strony bankowości internetowej przez linki w
						wiadomościach e-mail lub SMS
					</p>
				</li>
				<li className="flex items-start gap-2 sm:gap-3">
					<Check className="w-5 h-5 shrink-0 mt-0.5 text-green-800" />
					<p className="text-sm sm:text-base leading-relaxed">
						Nie używaj haseł, które są łatwe do odgadnięcia
					</p>
				</li>
				<li className="flex items-start gap-2 sm:gap-3">
					<Check className="w-5 h-5 shrink-0 mt-0.5 text-green-800" />
					<p className="text-sm sm:text-base leading-relaxed">
						Sprawdzaj adres strony logowania - zawsze zaczyna się od https:// i
						zawiera nazwę naszego banku
					</p>
				</li>
				<li className="flex items-start gap-2 sm:gap-3">
					<Check className="w-5 h-5 shrink-0 mt-0.5 text-green-800" />
					<p className="text-sm sm:text-base leading-relaxed">
						Nigdy nie podawaj swoich danych (identyfikatora, hasła, kodów SMS)
						osobom trzecim
					</p>
				</li>
				<li className="flex items-start gap-2 sm:gap-3">
					<Check className="w-5 h-5 shrink-0 mt-0.5 text-green-800" />
					<p className="text-sm sm:text-base leading-relaxed">
						W razie wątpliwości skontaktuj się z bankiem dzwoniąc na infolinię
						lub odwiedzając oddział
					</p>
				</li>
			</ul>
		</article>
	);
};

export default Card;
