import { GetTokenFromRequest } from './token-helper';
import { GetMetaProperty } from './storage-helper';
import { File } from '../types/google-cloud-types';
import {
  PermissionsObject,
  PermissionEntity,
  UserAccessResult
} from 'ngx-filemanager-core/public_api';

export interface UserCustomClaims {
  groups: string[];
}

export async function RetrieveCustomClaims(req: Request) {
  const token = await GetTokenFromRequest(req);
  const claims = token as UserCustomClaims;
  if (!claims.groups) {
    claims.groups = [];
  }
  return claims;
}

/*
  Number	Octal Permission Representation	Ref
  0	 ---  No permission
  1	 --x  Execute permission
  2	 -w-  Write permission
  3	 -wx  Execute and write permission: 1 (execute) + 2 (write) = 3
  4	 r--  Read permission
  5	 r-x  Read and execute permission: 4 (read) + 1 (execute) = 5
  6	 rw-  Read and write permission: 4 (read) + 2 (write) = 6
  7	 rwx  All permissions: 4 (read) + 2 (write) + 1 (execute) = 7
*/

export async function GetPermissionForFile(
  file: File,
  userPermissions: UserCustomClaims
): Promise<UserAccessResult> {
  const filePermissions: PermissionsObject = await GetMetaProperty(
    file,
    'permissions'
  );
  const groups = new Set(userPermissions.groups);

  const isReader = IsPartOfArray(filePermissions.readers, groups);
  const isWriter = IsPartOfArray(filePermissions.writers, groups);
  const isOwner = IsPartOfArray(filePermissions.owners, groups);

  let currentPerms: UserAccessResult = 0;
  if (isReader) {
    currentPerms += 4; // 4 (read)
  }
  if (isWriter) {
    currentPerms += 2; // 2 (write)
  }
  if (isOwner) {
    currentPerms += 1; // 1 (execute)
  }
  return currentPerms;
}

export function IsPartOfArray(
  arr: PermissionEntity[],
  userGroupSet: Set<string>
) {
  const hasNoPermissionsAtAll = !arr || arr.length;
  if (hasNoPermissionsAtAll) {
    return true;
  }
  const isInArray = arr.find(entity => userGroupSet.has(entity.id));
  return !!isInArray;
}
