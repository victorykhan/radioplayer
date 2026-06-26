import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import logger from '../lib/logger.js';

import { trackResource } from './resources/track.js';
import { trackCategoryResource } from './resources/trackCategory.js';
import { playlistResource } from './resources/playlist.js';
import { fallbackPoolItemResource } from './resources/fallbackPoolItem.js';
import { playLogResource } from './resources/playLog.js';
import { activityLogResource } from './resources/activityLog.js';
import { settingResource } from './resources/setting.js';
import { userResource } from './resources/user.js';

AdminJS.registerAdapter({ Database, Resource });

export function createAdmin(prisma) {
  const admin = new AdminJS({
    rootPath: '/admin',
    branding: {
      companyName: 'RadioPlay',
      softwareBrothers: false,
    },
    resources: [
      { resource: { model: getModelByName('Track'), client: prisma }, options: trackResource.options },
      { resource: { model: getModelByName('TrackCategory'), client: prisma }, options: trackCategoryResource.options },
      { resource: { model: getModelByName('Playlist'), client: prisma }, options: playlistResource.options },
      { resource: { model: getModelByName('FallbackPoolItem'), client: prisma }, options: fallbackPoolItemResource.options },
      { resource: { model: getModelByName('PlayLog'), client: prisma }, options: playLogResource.options },
      { resource: { model: getModelByName('ActivityLog'), client: prisma }, options: activityLogResource.options },
      { resource: { model: getModelByName('Setting'), client: prisma }, options: settingResource.options },
      { resource: { model: getModelByName('User'), client: prisma }, options: userResource.options },
    ],
  });

  const router = AdminJSExpress.buildRouter(admin);

  logger.info('AdminJS panel ready at /admin');
  return { admin, router };
}
