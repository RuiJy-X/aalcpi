import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { LandPlot, ShieldCheck, User, Clipboard } from 'lucide-react';

interface Props {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const tabs = ({ activeTab, setActiveTab }: Props) => {
    return (
        <div className="container mx-4">
            <Tabs
                value={activeTab}
                defaultValue="planters"
                className="w-[400px]"
                onValueChange={setActiveTab}
            >
                <TabsList className="">
                    <TabsTrigger value="planters">
                        <User />
                        Planters
                    </TabsTrigger>
                    <TabsTrigger value="productions">
                        <Clipboard />
                        Productions
                    </TabsTrigger>
                    <TabsTrigger value="certifications">
                        <ShieldCheck />
                        Certifications
                    </TabsTrigger>
                    <TabsTrigger value="lands">
                        <LandPlot />
                        Lands
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
};

export default tabs;
