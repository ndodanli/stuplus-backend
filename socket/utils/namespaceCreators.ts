export function groupChatName(groupId: string): string {
    return `gc-${groupId}`;
}
    
export function privateChatName(userId: string): string {
    return `pc-${userId}`;
}
    
export function userWatchRoomName(userId: string): string {
    return `wr-${userId}`;
}