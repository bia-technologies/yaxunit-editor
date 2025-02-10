import { GlobalScope } from '@/scope';
import { loadScope } from './loader'

export const PLATFORM_SCOPE_ID = 'platform-scope'
loadScope().then(s => GlobalScope.registerScope(PLATFORM_SCOPE_ID, s))
