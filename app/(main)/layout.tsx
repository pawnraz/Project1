import AppSidebar from '@/components/CustomSidebar';
import React from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
	return <AppSidebar>{children}</AppSidebar>;
};

export default MainLayout;
