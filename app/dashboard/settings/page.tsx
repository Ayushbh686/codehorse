"use client"
import { ProfileForm } from '@/module/settings/components/profile-form';
import { RepositoryList } from '@/module/settings/components/repository-list';
import React from 'react'

const SettingPage = () => {
  return (
    <div>
      <div className=" flex gap-3 flex-col">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and connected repositories</p>
        <ProfileForm/>
        <RepositoryList/>
      </div>
     
    </div>
  )
};

export default SettingPage;
