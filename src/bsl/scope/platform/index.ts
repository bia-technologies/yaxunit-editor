import { GlobalScope } from '@/common/scope'
import { loadScope } from './loader'

export const PLATFORM_SCOPE_ID = 'platform-scope'
GlobalScope.registerScope(PLATFORM_SCOPE_ID, loadScope())
