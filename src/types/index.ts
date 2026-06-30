export type Profiles = {
	id: string;
    created_at: string;
	first_name: string;
	last_name: string;
	phone: string;
    user_UID: string;
	email: string;
};

export type Transactions = {
	id: string;
    created_at: string;
    account_id: string;
    amount: number;
    type: string;
};

export type Accounts = {
	id: string;
    user_UID: string;
    account_number: string;
    balance: number;
    account_id: string;
};

