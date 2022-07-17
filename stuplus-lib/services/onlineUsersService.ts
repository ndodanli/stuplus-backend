export default class OnlineUserService {
    public static onlineUsers: Map<string, string> = new Map<string, string>();
    public static isOnline(userId: string): boolean {
        return OnlineUserService.onlineUsers.has(userId);
    }
}