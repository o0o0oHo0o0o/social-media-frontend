import React from 'react';
import ChatHeader from '../../components/Chat/ChatHeader';

export default function MessengerHeader({
  activeConv,
  me,
  onToggleDrawer,
  onOpenProfile,
  onStartCall,       // Hàm gọi Audio
  onStartVideoCall   // <--- THÊM CÁI NÀY (Hàm gọi Video)
}) {
  // Logic lấy chữ cái đầu này thực ra bên trong ChatHeader mới đã tự xử lý rồi
  // Nhưng để đây cũng không sao, không ảnh hưởng gì.
  const meInitial = me?.fullName?.[0] || me?.username?.[0] || 'M';

  return (
    <ChatHeader
      activeConv={activeConv}
      meInitial={meInitial}
      onToggleDrawer={onToggleDrawer}
      onOpenProfile={onOpenProfile}

      // Truyền cả 2 hàm xuống
      onStartCall={onStartCall}
      onStartVideoCall={onStartVideoCall} // <--- TRUYỀN XUỐNG ĐÂY
    />
  );
}