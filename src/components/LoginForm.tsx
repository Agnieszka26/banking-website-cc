import { LockKeyholeOpen } from "lucide-react";

const LoginForm = () => {
	return (
		<div className="p-4 rounded-lg border border-gray-200 w-1/4">
			<h1 className="flex items-center gap-2 font-bold text-xl mb-4 text-green-800">
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
			<button
				type="submit"
				className="bg-green-800 text-white p-2 rounded-md w-full"
			>
				Dalej
			</button>
			<p className="flex items-center gap-2 text-sm text-gray-500 pt-4">
				<LockKeyholeOpen className="text-green-800" /> pomoc w logowaniu{" "}
			</p>
		</div>
	);
};

export default LoginForm;
