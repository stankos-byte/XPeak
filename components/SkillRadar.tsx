
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { UserProfile, SkillCategory } from '../types';
import { getLevelProgress } from '../utils/gamification';

interface SkillRadarProps {
  user: UserProfile;
}

const SkillRadar: React.FC<SkillRadarProps> = ({ user }) => {
  const data = Object.values(SkillCategory)
    .filter(cat => cat !== SkillCategory.MISC)
    .map((category) => {
      const skill = user.skills[category];
      const progress = getLevelProgress(skill.xp, skill.level);
      return {
        subject: category,
        A: skill.level + (progress.percentage / 100),
        fullMark: 20,
      };
    });

  return (
    <div className="w-full h-full min-h-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#505353" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#f8fafc', fontSize: 10, fontWeight: 700 }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Radar
            name="Skills"
            dataKey="A"
            stroke="#00E1FF"
            strokeWidth={2}
            fill="#00E1FF"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SkillRadar;
