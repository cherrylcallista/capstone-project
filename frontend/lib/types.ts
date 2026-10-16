export type AccountType = {
	username: string;
	email: string;
	profilePicture: string;
	settings: {
		hideEmail: boolean;
		language: string;
		theme: string;
	};
}

export type AuthResponse = {
	token: string;
	account: AccountType;
};

export type TimerType = {

}

export type TaskType = {
	id: number;
	detail: string;
	addedTime: string;
	dueDate: string | null;
	markedAsFinished: boolean;
	repeatTask: boolean;
	repeatEvery: string | number | null;
	category: string;
	matrix?: number | null;
	isTodo: boolean;
}