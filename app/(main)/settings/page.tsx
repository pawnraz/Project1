import { EmailSettingsForm } from '@/components/EmailSettingsForm';
import React from 'react';

const Settings = () => {
	return (
		<div className='mx-auto my-5 max-w-2xl'>
			<h1>Settings Page</h1>
			<EmailSettingsForm />
		</div>
	);
};

export default Settings;
