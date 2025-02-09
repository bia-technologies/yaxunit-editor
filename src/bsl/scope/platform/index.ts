import { GlobalScope } from '@/scope';
import { loadScope } from './loader'

loadScope().then(GlobalScope.appendScope)
