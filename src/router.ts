// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/about`
  | `/admin/analytics`
  | `/admin/audit-logs`
  | `/admin/dashboard`
  | `/admin/fonts`
  | `/admin/settings`
  | `/admin/templates`
  | `/admin/templates/:id`
  | `/admin/tools`
  | `/admin/tools/:id/templates`
  | `/admin/users`
  | `/admin/users/:id`
  | `/all-tools`
  | `/all-tools/:id`
  | `/auth/forgot-password`
  | `/auth/login`
  | `/auth/register`
  | `/auth/reset-password`
  | `/contact`
  | `/dashboard`
  | `/documents`
  | `/documents/:id`
  | `/settings`
  | `/settings/api`
  | `/sub`
  | `/tools`
  | `/tools/:id`
  | `/tutorials`
  | `/wallet`

export type Params = {
  '/admin/templates/:id': { id: string }
  '/admin/tools/:id/templates': { id: string }
  '/admin/users/:id': { id: string }
  '/all-tools/:id': { id: string }
  '/documents/:id': { id: string }
  '/tools/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
