declare type WithChildrenProp<T = {}> = T & { children: import('preact').ComponentChildren }
