import React from 'react';

export interface Post {
  id: number;
  author: {
    name: string;
    avatarUrl: string;
  };
  category: string;
  title: string;
  content: string;
  date: string;
  comments: number;
  isNew: boolean;
  tags?: string[];
}

export interface Category {
  id: string;
  name:string;
  icon: React.ReactNode;
}

export type MenuItem =
  | {
      label: string;
      action?: () => void;
      disabled?: boolean;
      items?: MenuItem[];
      isSeparator?: false;
    }
  | {
      isSeparator: true;
    };


export interface Menu {
  name: string;
  items: MenuItem[];
}

export interface User {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  isAnonymous?: boolean;
}