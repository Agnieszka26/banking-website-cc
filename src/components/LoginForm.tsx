import { Link } from "@tanstack/react-router";
import { LockKeyholeOpen } from "lucide-react";

const LoginForm = () => {
	return (
		<div className="w-full lg:w-80 xl:w-96 shrink-0 p-5 sm:p-6 rounded-lg border border-gray-200 bg-card shadow-sm">
			<h1 className="font-bold text-lg sm:text-xl mb-4 sm:mb-5 text-green-800">
				Logowanie
			</h1>
			<form>
				<div className="mb-4">
					<label htmlFor="username" className="block mb-2">
						Identyfikatror
					</label>
					<input
						type="text"
						id="username"
						className="w-full p-2 rounded-md border border-gray-300"
						placeholder="Podaj identyfikator"
					/>
				</div>
			</form>

			<Link
				to="/sign-in/$"
				className="block w-full bg-green-800 text-white p-2.5 sm:p-3 rounded-md font-medium hover:bg-green-900 transition-colors text-center"
			>
				Dalej
			</Link>

			<Link to="/sign-in/$">
				<p className="flex items-center gap-2 text-sm text-gray-500 pt-4 sm:pt-5">
					<LockKeyholeOpen className="text-green-800" /> pomoc w logowaniu
				</p>
			</Link>
		</div>
	);
};

export default LoginForm;
