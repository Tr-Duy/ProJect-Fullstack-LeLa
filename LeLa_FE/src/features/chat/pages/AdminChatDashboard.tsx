import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';
import { useAdminChatNotifications } from '../hooks/useAdminChatNotifications';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import { ChatWindow } from '../components/ChatWindow';

export const AdminChatDashboard: React.FC = () => {
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);

  const { data: conversationsResponse, refetch } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: () => chatApi.getOpenConversations(),
  });

  const conversations = conversationsResponse?.data || [];

  useAdminChatNotifications(() => {
    // Tự động refetch danh sách khi có hội thoại mới
    refetch();
  });

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const { messages, isConnected, sendMessage } = useWebSocketChat(selectedConvId);

  const handleClose = async (id: number) => {
    try {
      await chatApi.closeConversation(id);
      setSelectedConvId(null);
      refetch();
    } catch (err) {
      console.error('Lỗi khi đóng hội thoại:', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 border-t">
      {/* Sidebar danh sách hội thoại */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-lg">Quản lý Chat ({conversations.length})</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">Không có cuộc hội thoại nào đang mở</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-4 border-b cursor-pointer transition-colors ${selectedConvId === conv.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-sm truncate pr-2">
                    {conv.userId ? conv.fullName || conv.username : conv.guestName}
                    {!conv.userId && <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1 rounded">GUEST</span>}
                  </h4>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {conv.lastMessage?.content || 'Chưa có tin nhắn...'}
                </p>
                {!conv.userId && conv.guestDepartment && (
                  <div className="text-[10px] text-orange-600 mt-1">{conv.guestDepartment}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vùng hiển thị Chat */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConv ? (
          <div className="flex-1 m-4 rounded-lg overflow-hidden border shadow-sm flex flex-col">
            <div className="bg-white p-3 border-b flex justify-between items-center">
              <div>
                <h3 className="font-semibold">
                  {selectedConv.userId ? selectedConv.fullName || selectedConv.username : selectedConv.guestName}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedConv.userId ? 'Learner' : `${selectedConv.guestPhone} | ${selectedConv.guestEmail || 'Không có email'}`}
                </p>
              </div>
              <button 
                onClick={() => handleClose(selectedConv.id)}
                className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 transition-colors font-medium"
              >
                Đóng hội thoại
              </button>
            </div>
            <div className="flex-1 h-0">
              <ChatWindow
                messages={messages}
                onSendMessage={sendMessage}
                currentUserRole="ADMIN"
                isConnected={isConnected}
                title="Hỗ trợ"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p>Chọn một cuộc hội thoại để bắt đầu hỗ trợ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
