// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/about`
  | `/admin`
  | `/admin/tools`
  | `/admin/tools/:id`
  | `/all-tools`
  | `/all-tools/:id`
  | `/auth/login`
  | `/auth/register`
  | `/dashboard`
  | `/documents`
  | `/documents/:id`
  | `/tools`
  | `/tools/:id`

export type Params = {
  '/admin/tools/:id': { id: string }
  '/all-tools/:id': { id: string }
  '/documents/:id': { id: string }
  '/tools/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
