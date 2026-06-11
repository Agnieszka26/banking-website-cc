import { Check, ShieldCheck } from "lucide-react";

const Card = () => {
	return (
		<article className="p-4 rounded-lg border border-gray-200 island-shell ">
			<h2 className="flex items-center gap-2 font-bold text-xl mb-4 text-green-800">
				{" "}
				<ShieldCheck className="w-12 h-12" />
				Bezpieczeństwo - zalecenia
			</h2>
			<ul>
				<li className="flex items-center gap-2 mb-3">
					{" "}
					<Check />{" "}
					<p>
						Nie wchodź na strony bankowości internetowej przez linki w
						wiadomościach e-mail lub SMS
					</p>
				</li>
				<li className="flex items-center gap-2 mb-3">
					{" "}
					<Check /> <p>
						{" "}
						Nie używaj haseł, które są łatwe do odgadnięcia{" "}
					</p>{" "}
				</li>
				<li className="flex items-center gap-2 mb-3">
					{" "}
					<Check />{" "}
					<p>
						Sprawdzaj adres strony logowania - zawsze zaczyna się od https:// i
						zawiera nazwę naszego banku{" "}
					</p>{" "}
				</li>
				<li className="flex items-center gap-2 mb-3">
					{" "}
					<Check />{" "}
					<p>
						Nigdy nie podawaj swoich danych (identyfikatora, hasła, kodów SMS)
						osobom trzecim{" "}
					</p>
				</li>
				<li className="flex items-center gap-2 mb-3">
					{" "}
					<Check />{" "}
					<p>
						W razie wątpliwości skontaktuj się z bankiem dzwoniąc na infolinię
						lub odwiedzając oddział{" "}
					</p>
				</li>
			</ul>
		</article>
	);
};

export default Card;
