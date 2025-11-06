import React from 'react';
import { AuthProvider } from './AuthContext';
import { CourseProvider } from './CourseContext';
import { ClassProvider } from './ClassContext';
import { RoomProvider } from './RoomContext';
import { ScheduleProvider } from './ScheduleContext';
import { EnrollmentProvider } from './EnrollmentContext';
import { AssessmentProvider } from './AssessmentContext';
import { NotificationProvider } from './NotificationContext';

/**
 * AppProviders - Wrap tất cả contexts
 * Sử dụng trong App.js để provide contexts cho toàn bộ app
 */
const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CourseProvider>
          <ClassProvider>
            <RoomProvider>
              <ScheduleProvider>
                <EnrollmentProvider>
                  <AssessmentProvider>
                    {children}
                  </AssessmentProvider>
                </EnrollmentProvider>
              </ScheduleProvider>
            </RoomProvider>
          </ClassProvider>
        </CourseProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppProviders;
